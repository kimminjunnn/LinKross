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
