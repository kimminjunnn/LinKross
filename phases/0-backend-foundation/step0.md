# Step 0: typed-supabase-contracts

## 읽어야 할 파일

- `AGENTS.md`
- `docs/DATA_SCHEMA_MVP.md`
- `docs/BACKEND_DEVELOPMENT_ROADMAP.md`
- `package.json`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/auth/workspace-access.ts`
- `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`

## 작업

- 적용된 Supabase v2 스키마의 TypeScript 타입을 생성한다.
- 브라우저·서버 클라이언트에 생성 타입을 연결한다.
- query/mutation 결과와 사용자용 오류 계약을 정한다.
- 기업·프리랜서 테스트 계정으로 역할 경계를 확인한다.
- owned files: `src/lib/supabase/*`, 새 DB 타입 파일, 새 공통 서버 결과 타입.
- non-goals: 페이지 UI 변경, 스키마 변경, service-role key 도입.

## Acceptance Criteria

```bash
npm run typecheck
npm run lint
npm run build
```

## 검증 절차

1. AC 명령을 실행한다.
2. 클라이언트 번들에 비공개 키가 포함되지 않았는지 확인한다.
3. `phases/0-backend-foundation/index.json`의 상태를 업데이트한다.

## 금지사항

- 기존 사용자 변경을 되돌리지 마라.
- Supabase 타입을 손으로 추정하지 마라.
