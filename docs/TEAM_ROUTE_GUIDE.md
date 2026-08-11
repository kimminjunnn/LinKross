# LinKross 팀 라우트 가이드

이 문서는 페이지별 병렬 구현 시 충돌을 줄이기 위한 최소 계약이다.

## 확정한 정보 구조

| 사용자 목적 | 라우트 | 주 작업 범위 |
| --- | --- | --- |
| 프로젝트 현황 확인 | `/projects` | 상태 필터, 현재 단계, 다음 행동 |
| 업무와 완료 조건 합의 | `/projects/[projectId]/sow` | 요구사항, SOW, WBS, 양측 승인 |
| 제출 결과 실행 검증 | `/projects/[projectId]/verification` | Commit SHA, 실행 로그, 테스트, Preview |
| 승인과 증빙 보관 | `/projects/[projectId]/evidence` | 사람의 승인, 인보이스, 지급 상태, 통합 증빙 |
| 지원자 검증 과제 관리 | `/assessments` | 검증 과제 및 응답 현황 |
| 지원자 응답 비교 | `/assessments/[assessmentId]` | 질문, 계획, 위험, 루브릭 근거 |
| 워크스페이스 관리 | `/settings` | GitHub 연동, 알림, 권한 |

## 공통 파일

다음 파일은 모든 페이지에 영향을 주므로 담당자 간 합의 없이 큰 구조를 바꾸지 않는다.

- `src/app/(dashboard)/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/*`
- `src/components/page/*`
- `src/components/project/project-tabs.tsx`
- `src/config/navigation.ts`
- `src/config/project-navigation.ts`

페이지 담당자는 자신의 라우트 폴더 안에서 먼저 구현하고, 재사용 가치가 확인된 컴포넌트만 공통 폴더로 올린다.

## 제품 원칙

- `지원자 검증`은 범용 채용·구인 마켓이 아니다. 프로젝트별 요구사항 이해도, 확인 질문, 실행 계획, 위험 대응을 검증한다.
- AI 결과는 초안과 판단 보조다. 업무 명세서 확정, 개발자 선정, 검수 승인에는 사람의 명시적 행동이 필요하다.
- 검수 상태와 지급 상태는 다른 상태 머신이다. 한 색상 또는 한 필드로 합치지 않는다.
- 검증은 브랜치 최신 상태가 아니라 제출 시점의 Commit SHA에 고정한다.
- 목록 화면에는 `현재 상태`뿐 아니라 사용자가 해야 할 `다음 행동`을 함께 보여준다.

## MVP 경계

초기 구현은 단일 프로젝트·개발자·저장소의 핵심 흐름을 우선한다. 범용 프리랜서 마켓, 에스크로, 모든 기술 스택 자동 검증은 MVP에 포함하지 않는다.
