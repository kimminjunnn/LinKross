# LinKross 백엔드 함수 계약

함수 계약은 페이지와 데이터베이스 사이의 공용 출입구다. 페이지 담당자는 테이블,
트리거와 RLS를 직접 다루지 않고 아래 함수와 반환 타입만 사용한다.

## 파일 위치

```text
src/lib/backend/contracts.ts   입력·출력·오류 타입
src/lib/backend/projects.ts    프로젝트 생성과 공개 조회
src/lib/backend/proposals.ts   제안서 제출·조회와 선정
src/lib/backend/index.ts       팀원이 import할 공용 진입점
```

## 공통 반환 형식

모든 함수는 예외 대신 판별 가능한 결과를 반환한다.

```ts
type BackendResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: BackendError };
```

사용 예시:

```ts
const result = await listPublicOpportunities();

if (!result.ok) {
  return <p>{result.error.message}</p>;
}

return result.data.map((opportunity) => opportunity.title);
```

## 함수 목록

### `createProject(input)`

- 사용자: 기업
- 용도: 프로젝트 등록 폼 제출
- 내부 동작: `create_project_with_requirements` RPC 호출
- 반환: `{ projectId }`
- 금지: 페이지에서 `projects.insert()` 직접 호출

### `listCompanyProjects()`

- 사용자: 기업(로그인 본인 소유 프로젝트만)
- 용도: `/company/assessments` 진행 전 프로젝트 목록
- 내부 동작: `projects`(lifecycle_stage='preparing', status='recruiting') 중 현재 요구사항 버전의 모집 마감 시각이 지나지 않은 프로젝트 + `project_requirement_versions` + `proposals` 건수 조회
- 반환: 프로젝트 요약 배열(제목, 상태, 예산, 모집 마감일, 제출 인원)

### `getCompanyProjectDetail(projectId)`

- 사용자: 해당 프로젝트 발주자 본인
- 용도: `/company/assessments/[assessmentId]/candidates`에서 본인이 등록한 공고 원문 표시
- 반환: 현재 요구사항 버전 전체(목표·요구사항·예산·일정·모집기간 등)
- 다른 기업의 프로젝트 ID를 넣으면 `NOT_FOUND`

### `getProjectDraft()` / `saveProjectDraft(formData)` / `deleteProjectDraft()`

- 사용자: 기업(로그인 본인)
- 용도: `/company/projects/new` "임시 저장" — `projects`/`project_requirement_versions`와
  완전히 분리된 `project_drafts` 테이블(회사당 1건, `form_data jsonb`)을 그대로 읽고 씀
- `create_project_with_requirements` RPC나 검증 로직과 무관 — 미완성 값도 그대로 저장됨
- 실제 등록(`createProject`) 성공 시 `deleteProjectDraft()`로 정리

### `getSowWorkspaceContext(projectId)` / `saveSowDraft(input)` / `submitSowForReview(input)`

- 사용자: 해당 프로젝트 발주자 본인
- 용도: `/company/projects/[projectId]/sow` — 프로젝트 컨텍스트(제목·선정 프리랜서 이름) 조회, SOW 초안 저장, 검토 요청 제출
- 내부 동작: `sow_versions`/`milestones`/`completion_criteria`에 순차 insert (RPC 없음 — RLS+트리거가 상태를 통제). 저장할 때마다 새 `version_number`를 만든다(수정이 아니라 새 버전 생성 — 승인 전 버전은 자유롭게 다시 저장 가능, DELETE 정책이 없어 기존 행은 지우지 않음).
- `saveSowDraft`는 `status='draft'`, `submitSowForReview`는 `status='in_review'` + `content_hash`/`submitted_for_review_at` 기록

### `getSowApprovalState(projectId)` / `approveSowAsCompany(input)`

- 사용자: 해당 프로젝트 발주자 본인
- 용도: `/company/projects/[projectId]/approval` — 최신 검토 대상 SOW 원문, 마일스톤, 완료조건과 양측 승인 상태 조회 및 PO 승인
- 승인 입력의 `sowVersionId`와 `contentHash`를 서버에서 다시 검증해 화면을 연 뒤 변경된 버전을 승인하지 않도록 막는다.
- 같은 사용자의 승인 재요청은 기존 승인 기록을 반환하는 멱등 동작으로 처리한다.
- 양측 승인 완료 시 `sow_approvals_finalize` DB 트리거가 SOW, 마일스톤과 프로젝트 상태를 한 트랜잭션에서 전환한다. 애플리케이션에서 같은 상태 전이를 중복 수행하지 않는다.

### `getApprovedSowMilestones(projectId)`

- 사용자: 해당 프로젝트 발주자 본인
- 용도: `/company/projects/[projectId]/verification` 마일스톤 탭 — 승인된 SOW의 마일스톤·완료조건만 표시
- 승인된 `sow_versions`(status='approved')이 아직 없으면 `milestones: []`로 빈 상태 반환(양측 승인 전에는 마일스톤 탭이 비어 있는 게 정상)
- PR/Commit/검수 결과(`milestone_submissions`, `verification_runs`, `criterion_results`)는 아직 연결 안 됨 — GitHub 연동은 별도 단계

### `listPublicOpportunities()`

- 사용자: 비로그인 포함
- 용도: `/opportunities` 목록
- 내부 동작: `public_opportunities` View 조회
- 반환: 공개 가능한 요약 배열

### `getPublicOpportunity(projectId)`

- 사용자: 비로그인 포함
- 용도: `/opportunities/[opportunityId]`
- 반환: 현재 요구사항 버전의 공개 상세

### `submitProposal(input)`

- 사용자: 프리랜서
- 용도: 자유 형식 수행 제안서 제출
- 내부 동작: 로그인 사용자 ID를 서버에서 정하고 `proposals`에 저장
- 반환: `{ proposalId }`

### `listProjectProposals(projectId)`

- 사용자: 해당 프로젝트 발주자
- 용도: 기업의 지원자 목록·원문 상세
- 반환: 제출 당시 프리랜서 프로필 스냅샷과 선정 여부

### `selectProposal(input)`

- 사용자: 해당 프로젝트 발주자
- 용도: 프리랜서 한 명 최종 선정
- 반환: `{ selectionId }`
- 효과: DB 트리거가 모집 상태를 `closed`로 변경

## 팀원 규칙

```ts
import {
  createProject,
  getPublicOpportunity,
  listProjectProposals,
  listPublicOpportunities,
  selectProposal,
  submitProposal,
} from "@/lib/backend";
```

- 이 모듈은 서버에서만 호출한다.
- Client Component는 직접 호출하지 않고 Server Action을 통해 호출한다.
- 페이지에서 Supabase 테이블을 직접 수정하지 않는다.
- `BackendResult`의 `ok`를 확인한 뒤 `data` 또는 `error`를 사용한다.
- DB 오류 원문 대신 `error.message`을 사용자에게 표시한다.
