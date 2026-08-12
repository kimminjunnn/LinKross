# LinKross 팀 라우트 가이드

이 문서는 페이지별 병렬 구현 시 충돌을 줄이기 위한 최소 계약이다.

## 확정한 정보 구조

| 사용자 목적 | 라우트 | 주 작업 범위 |
| --- | --- | --- |
| 첫 이용 목적 및 기본 정보 설정 | `/onboarding` | 개발자 모집·프로젝트 지원 선택, 역할별 최소 정보 입력 |
| 공개 프로젝트 탐색 | `/opportunities` | 비로그인 목록·상세 열람과 로그인 후 지원서 복귀 |
| 프로젝트 현황 확인 | `/company/projects` | 상태 필터, 현재 단계, 다음 행동 |
| 업무와 완료 조건 합의 | `/company/projects/[projectId]/sow` | 요구사항, SOW, 마일스톤, 양측 승인 |
| 착수 전 양측 승인 | `/company/projects/[projectId]/approval` | 현재 승인 대상 SOW와 기업·프리랜서 승인 상태 |
| 제출 결과 실행 검증 | `/company/projects/[projectId]/verification` | Commit SHA, 실행 로그, 테스트, Preview |
| 승인과 증빙 보관 | `/company/projects/[projectId]/evidence` | 사람의 승인, 인보이스, 지급 상태, 통합 증빙 |
| 개발자 모집 프로젝트 관리 | `/company/assessments` | 모집 프로젝트 및 수행 제안서 현황 |
| 수행 제안서 확인 | `/company/assessments/[assessmentId]` | 지원자별 제안서 원문 열람 및 프리랜서 선정 |
| 워크스페이스 관리 | `/company/settings` | GitHub 연동, 알림, 권한 |
| 프리랜서 홈 | `/freelancer` | 다음 행동, 기한과 차단 사유를 영어로 안내 |
| 프리랜서 지원 관리 | `/freelancer/applications` | 자유 형식 수행 제안서 작성, 제출 원문과 상태 확인 |
| 프리랜서 프로젝트 | `/freelancer/projects` | 선정 이후 SOW, 제출, 검수와 지급 상태 확인 |

루트 경로(`/`)는 공개 랜딩 화면이다. 로그인 사용자는 `profiles.active_role`에 따라 `/company` 또는 `/freelancer`로 이동한다. 한 사용자는 `user_roles`에 기업과 프리랜서 역할을 함께 보유할 수 있으며, 각 워크스페이스의 서버 레이아웃과 Server Action은 현재 URL이나 활성 역할이 아니라 실제 보유 역할을 검사한다. 헤더의 워크스페이스 전환은 역할을 추가한 뒤 `active_role`을 갱신한다.

온보딩은 로그인 전에도 접근할 수 있고, 선택한 목적에 맞는 기본 정보를 입력한 뒤 역할과 복귀 경로를 유지한 채 Google 로그인을 시작한다. 기존 계정도 역할별 로그인 또는 워크스페이스 전환을 통해 두 번째 역할을 추가할 수 있다. 기존 단일 역할 데이터베이스는 애플리케이션 배포 전에 `supabase/multi_role_profiles.sql`로 이전한다.

기업 워크스페이스의 사용자 문구는 한국어, 프리랜서 워크스페이스와 공개 프로젝트 탐색의 사용자 문구는 영어를 기본으로 한다. SOW와 수행 제안서 같은 제출 원문은 작성 언어를 그대로 보존한다.

## 공통 파일

다음 파일은 모든 페이지에 영향을 주므로 담당자 간 합의 없이 큰 구조를 바꾸지 않는다.

- `src/app/(workspaces)/company/layout.tsx`
- `src/app/(workspaces)/freelancer/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/*`
- `src/components/page/*`
- `src/components/project/project-tabs.tsx`
- `src/config/navigation.ts`
- `src/config/project-navigation.ts`
- `src/config/project-lifecycle.ts`

페이지 담당자는 자신의 라우트 폴더 안에서 먼저 구현하고, 재사용 가치가 확인된 컴포넌트만 공통 폴더로 올린다.

## 제품 원칙

- `개발자 모집`은 범용 채용·구인 마켓이 아니다. 지원자가 자유 형식의 수행 제안서를 제출하고 발주자가 원문을 직접 검토해 프리랜서를 선정한다.
- MVP에서는 수행 제안서의 AI 요약·분류, 자동 점수와 지원자 추천을 제공하지 않는다. AI는 업무 명세서와 검수 초안을 보조하며 확정에는 사람의 명시적 행동이 필요하다.
- 검수 상태와 지급 상태는 다른 상태 머신이다. 한 색상 또는 한 필드로 합치지 않는다.
- 검증은 브랜치 최신 상태가 아니라 제출 시점의 Commit SHA에 고정한다.
- 목록 화면에는 `현재 상태`뿐 아니라 사용자가 해야 할 `다음 행동`을 함께 보여준다.
- 프로젝트 상세 탭은 생명주기에 따라 구성한다. `착수 준비`는 `업무 명세서·승인`, `진행 중·완료·취소`는 `업무 명세서·마일스톤·검수·지급·증빙`을 사용한다.
- 진행 중·완료·취소 프로젝트의 승인된 SOW는 읽기 전용으로 표시한다. 변경이 필요하면 기존 버전을 수정하지 않고 새 버전을 만든다.
- 최종 승인된 마일스톤의 완료조건과 금액은 변경하지 않는다. 추가 작업이나 금액 조정은 별도 변경 마일스톤으로 기록한다.
- 프로젝트 상태와 지급 상태는 분리한다. 프로젝트 완료 이후에도 지급 상태와 외부 지급 참조값은 갱신할 수 있다.

## MVP 경계

초기 구현은 단일 프로젝트·개발자·저장소의 핵심 흐름을 우선한다. 범용 프리랜서 마켓, 에스크로, 모든 기술 스택 자동 검증은 MVP에 포함하지 않는다.
