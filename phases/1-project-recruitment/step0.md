# Step 0: project-proposal-selection-slice

## 읽어야 할 파일

- `AGENTS.md`
- `docs/DATA_SCHEMA_MVP.md`
- `docs/TEAM_ROUTE_GUIDE.md`
- `docs/BACKEND_DEVELOPMENT_ROADMAP.md`
- `src/app/(workspaces)/company/projects/new/page.tsx`
- `src/app/opportunities/page.tsx`
- `src/app/opportunities/[opportunityId]/page.tsx`
- `src/app/(workspaces)/freelancer/applications/[assessmentId]/page.tsx`
- `src/app/(workspaces)/company/assessments/[assessmentId]/page.tsx`
- `node_modules/next/dist/docs/01-app/02-guides/forms.md`

## 작업

- 프로젝트 생성 RPC, 공개 조회, 제안서 제출·조회와 선정 mutation을 수직으로 연결한다.
- 하드코딩과 localStorage를 이 흐름에서 제거한다.
- 모집 마감, 중복 지원, 비인가 열람과 중복 선정을 사용자에게 설명 가능한 오류로 표시한다.
- owned files: 위 라우트와 신규 `projects`/`proposals` 서버 모듈.
- non-goals: SOW, GitHub, 검수, 지급 기능.

## Acceptance Criteria

```bash
npm run typecheck
npm run lint
npm run build
```

## 검증 절차

1. 기업이 프로젝트를 등록한다.
2. 프리랜서 계정으로 지원한다.
3. 기업이 원문을 읽고 한 명을 선정한다.
4. 중복·마감·타 사용자 접근이 차단되는지 확인한다.
5. phase 상태를 업데이트한다.

## 금지사항

- 페이지에서 service-role key로 RLS를 우회하지 마라.
- 제출된 제안서 원문을 update 또는 delete하지 마라.
