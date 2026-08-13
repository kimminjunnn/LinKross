# LinKross 백엔드 개발 로드맵

기준일: 2026-08-13
기준 스키마: `mvp_domain_schema.sql` + `mvp_schema_fix_v2.sql`

## 목표

백엔드는 화면 묶음이 아니라 다음 사용자 흐름을 순서대로 완성한다.

```text
인증·권한
  → 프로젝트 등록·공개 조회
  → 수행 제안서 제출·선정
  → SOW·마일스톤·양측 승인
  → PR·Commit SHA 검수·사람의 결정
  → 인보이스·지급 상태·통합 증빙
```

기업 화면과 프리랜서 화면을 별도 시스템처럼 개발하지 않는다. 하나의 프로젝트와
제안서 데이터를 각 역할이 서로 다른 권한으로 사용하는 수직 흐름으로 연결한다.

## 개발 전 공통 규칙

- `profiles.active_role`은 화면 진입 기본값이고 권한 근거가 아니다.
- 서버는 `user_roles`와 Supabase RLS를 기준으로 권한을 다시 확인한다.
- 프로젝트 직접 `insert`는 사용하지 않고 `create_project_with_requirements` RPC를 호출한다.
- 요구사항 수정은 `update_project_requirements` RPC를 호출한다.
- 공개 모집 목록은 `public_opportunities` View에서 읽는다.
- 제출된 제안서, 승인된 SOW, Commit SHA와 검수 결과를 덮어쓰거나 삭제하지 않는다.
- 사용자에게 임의의 DB 오류 문자열을 그대로 보여주지 않고 안전한 문구로 변환한다.
- 공통 Supabase 클라이언트와 생성 타입은 팀장만 수정한다.

## Phase 0. 기반 고정

예상: 반나절

### 구현

1. 현재 Supabase 스키마에서 TypeScript 타입을 생성하고 저장소에 추가한다.
2. 브라우저/서버 Supabase 클라이언트가 생성 타입을 사용하도록 한다.
3. 환경변수 누락 시 명확한 오류를 내도록 한다.
4. 공통 결과 타입과 사용자용 오류 매핑을 만든다.
5. 기업·프리랜서 테스트 계정을 각각 준비한다.

### 완료 기준

- `npm run typecheck`, `npm run lint`, `npm run build`가 통과한다.
- 기업 계정은 기업 워크스페이스, 프리랜서는 프리랜서 워크스페이스에 접근한다.
- 다른 역할의 보호된 워크스페이스 접근은 서버에서 차단된다.

## Phase 1. 프로젝트 등록과 공개 조회

예상: 1일

### 쓰기 흐름

- `/company/projects/new` 폼을 Server Action에 연결한다.
- 서버에서 필수값, 날짜 순서, 모집 기간, 예산을 검증한다.
- `create_project_with_requirements` RPC를 한 번 호출한다.
- 첨부파일은 프로젝트 생성 성공 후 정해진 Storage 경로에 업로드한다.
- 성공 시 생성된 프로젝트 상세로 이동하고 실패 시 입력값을 유지한다.

### 읽기 흐름

- `/opportunities`를 `public_opportunities` View 조회로 교체한다.
- `/opportunities/[opportunityId]`는 현재 요구사항 버전만 표시한다.
- `/company/projects`와 `/company/assessments`는 로그인 기업이 소유한 프로젝트만 조회한다.
- 로딩, 빈 목록, 존재하지 않는 ID와 조회 오류를 구분한다.

### 완료 기준

- 기업이 등록한 프로젝트가 로그아웃 상태의 공개 목록에 나타난다.
- 모집 전·마감 후·closed 프로젝트는 공개 목록에 나타나지 않는다.
- 다른 기업은 해당 프로젝트를 수정할 수 없다.

## Phase 2. 수행 제안서와 프리랜서 선정

예상: 1일

### 구현

- `/freelancer/applications/[assessmentId]`의 localStorage를 `proposals`로 교체한다.
- 자유 형식 `content` 원문과 선택 메모를 그대로 저장한다.
- 제안서 목록·상세를 기업의 모집 관리 화면에 연결한다.
- 선정 버튼은 `selections` 한 행을 생성한다.
- 선정 성공 후 모집은 닫히고 선정 프리랜서만 프로젝트 참여자가 된다.

### 경계 조건

- 같은 프리랜서의 프로젝트 중복 지원 차단
- 모집 마감 후 제출 차단
- 제출 원문 수정·삭제 차단, 철회는 이력 보존
- 다른 기업의 제안서 열람·선정 차단
- 프로젝트당 두 번째 선정 차단

### 완료 기준

기업 등록 → 프리랜서 지원 → 기업 원문 확인 → 한 명 선정 흐름이 두 계정으로
처음부터 끝까지 실제 DB에서 동작한다. 이 시점을 첫 번째 MVP 체크포인트로 삼는다.

## Phase 3. SOW와 양측 승인

예상: 2일

### 구현

- 선정된 제안서와 해당 요구사항 버전으로 `sow_versions` 초안을 만든다.
- 마일스톤과 완료조건을 초안에 저장한다.
- 완료조건은 반드시 `milestone_id`와 함께 저장하고, 프로젝트 공통 조건은 마지막 마일스톤에 배정한다.
- 검토 요청 시 SOW 상태를 `in_review`로 바꾼다.
- 기업과 선정 프리랜서가 같은 `content_hash`를 각각 승인한다.
- 수정 요청은 `sow_revision_requests`에 사유와 검토 대상을 append-only로 기록한다.
- 수정 요청된 원문을 바꾸지 않고 새 SOW 버전에서 수정한다.
- 양측 승인 이후 승인 버전, 마일스톤과 완료조건을 읽기 전용으로 표시한다.

### 완료 기준

- 비선정 프리랜서는 SOW를 읽거나 승인할 수 없다.
- 한쪽 승인만으로 프로젝트가 진행 중이 되지 않는다.
- 승인 후 원문·일정·금액·완료조건 수정이 DB에서 거부된다.

## Phase 4. GitHub 제출과 실행 검수

예상: 3~5일

### 구현 순서

1. 프로젝트당 공개 GitHub 저장소 하나 연결
2. PR URL 검증 및 GitHub에서 40자리 head Commit SHA 확인
3. `milestone_submissions`와 완료 주장 조건 저장
4. 멱등 키를 가진 `verification_runs` 생성
5. 격리 Runner에서 설치·빌드·실행·Playwright 수행
6. 조건별 결과와 로그·스크린샷·Preview 저장
7. 발주자의 수정 요청 또는 최종 승인 저장
8. 새 SHA 제출 시 이전 결과를 유지한 채 재검수

### 완료 기준

- 실패 Commit과 수정 Commit에서 같은 테스트가 각각 실제 실패·통과한다.
- 자동 통과만으로 마일스톤이 승인되지 않는다.
- 운영 서버에서 제출 코드를 직접 실행하지 않는다.

## Phase 5. 인보이스·지급 상태·통합 증빙

예상: 1~2일

### 구현

- 승인된 마일스톤에 인보이스를 연결한다.
- 지급 요청·처리 중·지급 완료 상태와 외부 참조값을 기록한다.
- 기존 지급 API가 `project_id`, `milestone_record_id`, `invoice_id`를 저장하도록 바꾼다.
- 요구사항부터 지급까지 연결한 프로젝트 단위 증빙 버전을 생성한다.

### 완료 기준

- 프로젝트 참여자만 인보이스와 지급 기록을 읽는다.
- 검수 통과가 지급 완료를 자동 생성하지 않는다.
- 기존 지급 기록의 legacy `milestone_id` 조회가 깨지지 않는다.

## 내일 5인 역할 분배

내일 목표는 Phase 0~2의 첫 수직 흐름이다. SOW 이후에는 손대지 않는다.

| 담당 | 역할 | 소유 범위 | 완료 결과 |
| --- | --- | --- | --- |
| 팀장 | 데이터 계약·권한·통합 | 생성 DB 타입, 공통 Supabase 코드, Server Action 계약, RLS 테스트, 최종 병합 | 팀원이 사용할 함수와 타입을 오전에 고정하고 전체 흐름 검증 |
| 팀원 A | 기업 프로젝트 등록 | `/company/projects/new`, 프로젝트 생성 Action의 폼 연결 | 기업이 실제 프로젝트 생성 |
| 팀원 B | 공개 프로젝트 조회 | `/opportunities`, `/opportunities/[opportunityId]` | 생성 프로젝트가 공개 목록·상세에 표시 |
| 팀원 C | 프리랜서 제안서 | `/freelancer/applications/*`, 제안서 mutation | 실제 제안서 제출·중복/마감 오류 표시 |
| 팀원 D | 기업 제안서 검토·선정 | `/company/assessments/*`, 선정 mutation | 원문 열람 후 한 명 선정 |

### 팀장의 가장 어렵고 중요한 일

1. 오전 첫 1~2시간 동안 생성 타입과 서버 함수 입출력을 고정한다.
2. 팀원에게 SQL이나 RLS 수정을 맡기지 않는다.
3. 각 팀원이 사용할 함수 이름, 입력, 반환값을 먼저 제공한다.
4. 기업·프리랜서 두 계정으로 RLS를 직접 검증한다.
5. 오후에는 페이지를 대신 구현하기보다 네 작업을 한 흐름으로 연결하고 충돌을 해결한다.

## 팀원에게 제공할 공통 함수 계약

구현 세부가 아니라 다음 역할의 함수를 먼저 합의한다.

```text
createProject(input) -> { projectId } | user-facing error
listPublicOpportunities() -> opportunity summary[]
getPublicOpportunity(id) -> opportunity detail | not found
submitProposal(projectId, content, optionalNotes) -> proposalId | error
listProjectProposals(projectId) -> proposal[]
selectProposal(projectId, proposalId) -> selectionId | error
```

페이지는 이 함수만 호출하고 RLS 우회용 service-role key를 사용하지 않는다.

## 매 단계 작업 방식

각 기능은 아래 순서로 한 번에 하나씩 연결한다.

1. 해당 페이지의 하드코딩/localStorage 위치 확인
2. 서버 query 또는 mutation 작성
3. 역할·소유권·현재 상태 검증
4. 페이지에 로딩·빈 상태·오류·성공 상태 연결
5. 반대 역할 계정과 비로그인 상태로 접근 차단 확인
6. typecheck → lint → build
7. 한 가지 실제 사용자 흐름을 브라우저에서 끝까지 실행

## 금지할 작업

- Table Editor에서 임의로 컬럼이나 정책 수정
- 화면마다 별도의 Supabase client 생성
- 클라이언트에 service-role key 사용
- localStorage와 DB를 동시에 진실 소스로 유지
- 화면 버튼 숨김만으로 권한 처리
- 제안서·승인 문서·검수 결과를 update로 덮어쓰기
- Phase 2가 끝나기 전에 GitHub Runner나 결제를 병렬 구현

## 전체 MVP 종료 조건

다음 데모가 실제 계정과 실제 DB로 끊김 없이 동작해야 한다.

```text
기업 프로젝트 등록
→ 프리랜서 3명 지원
→ 기업 1명 선정
→ SOW와 완료조건 4개 양측 승인
→ PR·Commit SHA 제출
→ 로그인 기능 검수 실패
→ 새 SHA 재검수 통과
→ 기업 최종 승인
→ 인보이스·지급 상태·통합 증빙 확인
```
