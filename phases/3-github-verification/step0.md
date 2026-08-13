# Step 0: commit-pinned-verification

## 읽어야 할 파일

- `AGENTS.md`
- `docs/DATA_SCHEMA_MVP.md`
- `docs/MILESTONE_VERIFICATION_DESIGN.md`
- `docs/BACKEND_DEVELOPMENT_ROADMAP.md`
- `src/app/(workspaces)/company/projects/[projectId]/verification/page.tsx`

## 작업

- 프로젝트 저장소, PR과 GitHub에서 확인한 전체 Commit SHA를 저장한다.
- 멱등한 검수 실행, 조건별 결과, 비공개 증거와 사람의 결정을 연결한다.
- 제출 코드는 운영 서버가 아닌 제한된 일회성 환경에서 실행한다.
- owned files: 검수 라우트, GitHub 서버 모듈, Runner 연동, 증거 저장 모듈.
- non-goals: private GitHub App, 다중 저장소, 자동 최종 승인.

## Acceptance Criteria

```bash
npm run typecheck
npm run lint
npm run build
```

## 검증 절차

1. 실패 SHA를 제출해 준비된 Playwright 테스트 실패와 증거를 확인한다.
2. 수정 SHA를 새 제출로 저장해 같은 테스트 통과를 확인한다.
3. 이전 결과가 유지되는지 확인한다.
4. 발주자 승인 전 마일스톤이 자동 승인되지 않는지 확인한다.

## 금지사항

- 브랜치명을 검수 대상으로 저장하지 마라.
- 운영 비밀과 실제 고객 데이터를 Runner에 제공하지 마라.
