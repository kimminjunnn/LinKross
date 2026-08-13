# Step 0: versioned-sow-dual-approval

## 읽어야 할 파일

- `AGENTS.md`
- `docs/DATA_SCHEMA_MVP.md`
- `docs/BACKEND_DEVELOPMENT_ROADMAP.md`
- `src/app/(workspaces)/company/projects/[projectId]/sow/page.tsx`
- `src/app/(workspaces)/company/projects/[projectId]/approval/page.tsx`
- `src/lib/sow-approval.ts`

## 작업

- 선정 제안서와 요구사항 버전에서 SOW 초안을 생성한다.
- 마일스톤, 완료조건, content hash와 기업·프리랜서 승인을 연결한다.
- 승인 이후 원문과 하위 항목을 읽기 전용으로 만든다.
- owned files: SOW·승인 라우트와 신규 SOW 서버 모듈.
- non-goals: GitHub 제출, 자동 검수, 결제.

## Acceptance Criteria

```bash
npm run typecheck
npm run lint
npm run build
```

## 검증 절차

1. 선정된 프로젝트에서 SOW를 만든다.
2. 두 역할이 같은 버전을 승인한다.
3. 한쪽 승인과 비선정 사용자 접근을 차단한다.
4. 승인 이후 변경이 거부되는지 확인한다.

## 금지사항

- 승인된 SOW를 덮어쓰지 마라.
- AI 결과로 양측 승인을 대신하지 마라.
