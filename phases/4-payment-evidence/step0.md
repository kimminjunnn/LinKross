# Step 0: invoice-payment-evidence

## 읽어야 할 파일

- `AGENTS.md`
- `docs/DATA_SCHEMA_MVP.md`
- `docs/BACKEND_DEVELOPMENT_ROADMAP.md`
- `src/app/(workspaces)/company/projects/[projectId]/evidence/page.tsx`
- `src/app/api/payments/record/route.ts`
- `src/lib/payments.ts`

## 작업

- 승인 마일스톤에 인보이스와 지급 상태를 연결한다.
- 지급 API가 새 project/milestone/invoice FK를 저장하게 한다.
- 프로젝트 단위 통합 증빙 버전을 생성하고 참여자만 조회하게 한다.
- owned files: 지급 API, 지급 서버 모듈, 증빙 라우트와 생성 모듈.
- non-goals: 에스크로, 자동 송금, 법률·세무 증명.

## Acceptance Criteria

```bash
npm run typecheck
npm run lint
npm run build
```

## 검증 절차

1. 승인된 마일스톤에 인보이스를 제출한다.
2. 지급 상태와 외부 참조값을 기록한다.
3. 프로젝트 참여자와 비참여자의 조회 권한을 비교한다.
4. 통합 증빙에 전체 이력이 포함되는지 확인한다.

## 금지사항

- 검수 결과만으로 지급 완료를 만들지 마라.
- LinKross가 실제 자금을 보관·송금한다고 표현하지 마라.
