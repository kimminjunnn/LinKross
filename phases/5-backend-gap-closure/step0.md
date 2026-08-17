# Step 0: audit-mock-and-backend-gaps

## 읽어야 할 파일

- `AGENTS.md`
- `docs/BACKEND_DEVELOPMENT_ROADMAP.md`
- `docs/BACKEND_FUNCTION_CONTRACTS.md`
- `docs/DATA_SCHEMA_MVP.md`
- `docs/MILESTONE_VERIFICATION_DESIGN.md`
- `supabase/mvp_domain_schema.sql`
- `src/app/(workspaces)/**`
- `src/lib/backend/**`

## 작업

- 화면별 mock, localStorage, 하드코딩 상태와 비활성 버튼을 전수 조사한다.
- 현재 스키마와 RLS로 구현 가능한 연결, 외부 Runner·GitHub App·Storage 설정이 필요한 연결을 구분한다.
- 실제 DB가 단일 진실 소스가 되도록 모집, SOW, 검수 기록, 지급·증빙 순서로 연결한다.
- owned files: `src/lib/backend/**`, 관련 Server Action과 워크스페이스 라우트, 백엔드 현황 문서.
- non-goals: 운영 서버에서 제출 코드 실행, 자동 최종 승인, 에스크로·자동 송금, private GitHub App.

## Acceptance Criteria

```bash
npm run typecheck
npm run lint
npm run build
```

## 검증 절차

1. mock/localStorage 검색 결과를 구현 전후 비교한다.
2. 각 mutation이 서버에서 역할·프로젝트 참여·상태를 검증하는지 확인한다.
3. 외부 인프라 없이는 실행할 수 없는 항목을 문서에 명시한다.

## 금지사항

- 기존 사용자 변경을 되돌리지 마라.
- service-role key를 클라이언트나 일반 Server Action에 넣지 마라.
- 자동 검수 결과로 사람의 최종 승인을 대신하지 마라.
